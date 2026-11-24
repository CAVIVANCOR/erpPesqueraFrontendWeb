// src/components/resumenSunat/ResumenSunatForm.jsx
// Vista de SOLO LECTURA de un resumen diario de boletas (RC) o comunicación de baja (RA).
// Los resúmenes los genera el proceso de facturación electrónica y su estado lo actualiza la consulta del ticket en
// Smart PSE: por eso el formulario no tiene botones de guardar ni de eliminar y todos los campos están deshabilitados.
import React from "react";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Button } from "primereact/button";
import { formatearFecha, formatearNumero } from "../../utils/utils";

const NOMBRE_TIPO = { RC: "Resumen diario de boletas (RC)", RA: "Comunicación de baja (RA)" };
const OPERACION_ITEM = { 1: "Adicionar", 2: "Modificar", 3: "Anular / dar de baja" };
const SEVERIDAD_ESTADO = { PENDIENTE: "warning", ENVIADO: "info", ACEPTADO: "success", RECHAZADO: "danger", ERROR: "danger" };

const Campo = ({ id, etiqueta, valor, ancho = 1 }) => (
  <div style={{ flex: ancho }}>
    <label htmlFor={id}>{etiqueta}</label>
    <InputText id={id} value={valor ?? ""} disabled style={{ width: "100%", fontWeight: "bold" }} />
  </div>
);

const formatearFechaHora = (valor) => (valor ? new Date(valor).toLocaleString("es-PE") : "");

export default function ResumenSunatForm({ resumen, onCerrar }) {
  if (!resumen) return null;

  return (
    <div className="p-fluid" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 12 }}>
        <Campo id="empresa" etiqueta="Empresa" valor={resumen.empresa?.razonSocial} ancho={2} />
        <Campo id="tipo" etiqueta="Tipo" valor={NOMBRE_TIPO[resumen.tipo] || resumen.tipo} ancho={2} />
        <Campo id="fechaReferencia" etiqueta="Fecha de referencia" valor={formatearFecha(resumen.fechaReferencia)} />
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <Campo id="nombreArchivo" etiqueta="Nombre del archivo" valor={resumen.nombreArchivo} ancho={2} />
        <Campo id="ticket" etiqueta="Ticket SUNAT" valor={resumen.ticket} ancho={2} />
        <div style={{ flex: 1 }}>
          <label>Estado</label>
          <div style={{ paddingTop: 6 }}>
            <Tag value={resumen.estado} severity={SEVERIDAD_ESTADO[resumen.estado] || "secondary"} />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <Campo id="codigoRespuesta" etiqueta="Código de respuesta" valor={resumen.codigoRespuesta} />
        <Campo id="fechaCreacion" etiqueta="Creado" valor={formatearFechaHora(resumen.fechaCreacion)} />
        <Campo id="fechaRespuesta" etiqueta="Respuesta de SUNAT" valor={formatearFechaHora(resumen.fechaRespuesta)} />
      </div>

      <div>
        <label htmlFor="mensajeRespuesta">Mensaje de SUNAT</label>
        <InputTextarea id="mensajeRespuesta" value={resumen.mensajeRespuesta ?? ""} disabled rows={2} style={{ width: "100%" }} />
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <Campo id="rutaLocalXML" etiqueta="XML guardado" valor={resumen.rutaLocalXML} ancho={2} />
        <Campo id="rutaLocalCDR" etiqueta="CDR guardado" valor={resumen.rutaLocalCDR} ancho={2} />
      </div>

      <h4 style={{ margin: "8px 0 0" }}>Comprobantes informados ({resumen.detalles?.length ?? 0})</h4>
      <DataTable value={resumen.detalles || []} size="small" stripedRows showGridlines emptyMessage="Sin comprobantes">
        <Column field="numeroLinea" header="#" style={{ width: 50 }} />
        <Column header="Comprobante" body={(d) => d.comprobanteElectronico?.numeroCompleto} />
        <Column header="Fecha de emisión" body={(d) => formatearFecha(d.comprobanteElectronico?.fechaEmision)} />
        <Column header="Cliente" body={(d) => d.comprobanteElectronico?.razonSocialCliente} />
        <Column
          header="Total"
          body={(d) => (d.comprobanteElectronico ? formatearNumero(d.comprobanteElectronico.totalComprobante) : "")}
          style={{ textAlign: "right" }}
        />
        <Column header="Operación" body={(d) => OPERACION_ITEM[d.estadoItem] || d.estadoItem} />
        <Column field="motivo" header="Motivo" />
      </DataTable>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        <Button type="button" label="Cerrar" icon="pi pi-times" className="p-button-text" onClick={onCerrar} style={{ width: "auto" }} />
      </div>
    </div>
  );
}
