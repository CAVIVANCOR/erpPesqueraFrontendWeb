import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { Tag } from "primereact/tag";
import { getRecibosPlame4ta, getArchivosPlame4ta } from "../../api/recursosHumanos/plame4ta";
import { formatearFecha } from "../../utils/utils";
import { mensajeDeError } from "../../utils/mensajeError";

const formatearMonto = (valor) => Number(valor || 0).toLocaleString("es-PE", { style: "currency", currency: "PEN" });

const descargarTexto = (nombre, lineas) => {
  const blob = new Blob([lineas.join("\r\n") + "\r\n"], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
};

/**
 * PLAME de prestadores con rentas de 4ta categoría: lista los recibos por honorarios pagados en el mes y genera
 * los archivos .ps4 (prestadores) y .4ta (comprobantes) solo con los recibos marcados.
 */
export default function Plame4taDialog({ visible, onHide, empresaId, mes, toast }) {
  const [recibos, setRecibos] = useState([]);
  const [seleccion, setSeleccion] = useState([]);
  const [soloConRetencion, setSoloConRetencion] = useState(true);
  const [loading, setLoading] = useState(false);

  const anio = mes.getFullYear();
  const numeroMes = mes.getMonth() + 1;

  const mostrarError = (error, accion) =>
    toast.current?.show({ severity: "error", summary: "Error", detail: mensajeDeError(error, accion), life: 6000 });

  useEffect(() => {
    if (!visible) return;
    const cargar = async () => {
      if (!empresaId) {
        toast.current?.show({ severity: "warn", summary: "Atención", detail: "Seleccione la empresa del archivo de PLAME", life: 4000 });
        onHide();
        return;
      }
      try {
        setLoading(true);
        const filas = await getRecibosPlame4ta(empresaId, anio, numeroMes, soloConRetencion);
        setRecibos(filas);
        setSeleccion(filas);
      } catch (error) {
        mostrarError(error, "No se pudieron cargar los recibos por honorarios");
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [visible, empresaId, anio, numeroMes, soloConRetencion]);

  const generar = async () => {
    try {
      setLoading(true);
      const { nombreBase, ps4, cuarta } = await getArchivosPlame4ta(empresaId, anio, numeroMes, seleccion.map((r) => r.cuentaPorPagarId));
      descargarTexto(`${nombreBase}.ps4`, ps4);
      descargarTexto(`${nombreBase}.4ta`, cuarta);
      toast.current?.show({ severity: "success", summary: "Éxito", detail: `Archivos generados: ${ps4.length} prestadores y ${cuarta.length} comprobantes`, life: 4000 });
      onHide();
    } catch (error) {
      mostrarError(error, "No se pudieron generar los archivos de PLAME de 4ta categoría");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog header={`PLAME 4ta categoría - ${String(numeroMes).padStart(2, "0")}/${anio}`} visible={visible} style={{ width: "90vw", maxWidth: 1100 }} onHide={onHide} modal>
      <p style={{ marginTop: 0 }}>
        Recibos por honorarios pagados en el mes (PLAME los declara en el mes de pago). Marque los que desea enviar.
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Checkbox inputId="soloRetencion" checked={soloConRetencion} onChange={(e) => setSoloConRetencion(e.checked)} />
        <label htmlFor="soloRetencion">Mostrar solo los recibos con retención de 4ta</label>
      </div>
      <DataTable
        value={recibos}
        loading={loading}
        selection={seleccion}
        onSelectionChange={(e) => setSeleccion(e.value)}
        dataKey="cuentaPorPagarId"
        size="small"
        showGridlines
        stripedRows
        emptyMessage="No hay recibos por honorarios pagados en este mes"
      >
        <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
        <Column header="Prestador" body={(r) => r.proveedor} />
        <Column header="RUC" field="documentoProveedor" style={{ width: 120 }} />
        <Column header="Recibo" field="comprobante" style={{ width: 130 }} />
        <Column header="Emisión" body={(r) => formatearFecha(r.fechaEmision)} style={{ width: 110 }} />
        <Column header="Pago" body={(r) => formatearFecha(r.fechaPago)} style={{ width: 110 }} />
        <Column header="Monto" body={(r) => formatearMonto(r.montoTotal)} style={{ width: 120, textAlign: "right" }} />
        <Column
          header="Retención 4ta"
          body={(r) => (r.conRetencion ? <Tag value={formatearMonto(r.montoRetencion)} severity="warning" /> : <Tag value="SIN RETENCION" severity="secondary" />)}
          style={{ width: 150 }}
        />
      </DataTable>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
        <span>{seleccion.length} de {recibos.length} recibos marcados</span>
        <div style={{ display: "flex", gap: 8 }}>
          <Button type="button" label="Cancelar" icon="pi pi-times" className="p-button-text" onClick={onHide} />
          <Button type="button" label="Generar .ps4 y .4ta" icon="pi pi-download" severity="success" onClick={generar} loading={loading} disabled={seleccion.length === 0} />
        </div>
      </div>
    </Dialog>
  );
}
