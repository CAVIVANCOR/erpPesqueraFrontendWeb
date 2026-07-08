/**
 * ComprobanteGastoTab.jsx - Tab para visualizar comprobante de gasto
 *
 * Componente para mostrar el comprobante de gasto de un movimiento de caja.
 * Usa PDFDocumentManager en modo solo lectura.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React from "react";
import { Panel } from "primereact/panel";
import { Message } from "primereact/message";
import PDFDocumentManager from "../../pdf/PDFDocumentManager";
import { useForm } from "react-hook-form";

export default function ComprobanteGastoTab({ movimiento, toast }) {
  const { control, setValue, watch, getValues } = useForm({
    defaultValues: {
      urlDocumentoMovCaja: movimiento?.urlDocumentoMovCaja || ""
    }
  });

  const urlPdf = movimiento?.urlDocumentoMovCaja;

  if (!urlPdf) {
    return (
      <div className="flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
        <Message
          severity="info"
          text="No hay comprobante de gasto disponible para este movimiento"
          style={{ width: "100%" }}
        />
      </div>
    );
  }

  return (
    <div className="grid">
      {/* Datos del Comprobante */}
      <div className="col-12">
        <Panel header="Datos del Comprobante" className="mb-3">
          <div className="grid">
            <div className="col-12 md:col-4">
              <div className="field">
                <label className="font-bold">Tipo de Documento:</label>
                <p>{movimiento.tipoDocumento?.nombre || "-"}</p>
              </div>
            </div>
            <div className="col-12 md:col-4">
              <div className="field">
                <label className="font-bold">Serie:</label>
                <p>{movimiento.numeroSerieComprobante || "-"}</p>
              </div>
            </div>
            <div className="col-12 md:col-4">
              <div className="field">
                <label className="font-bold">Correlativo:</label>
                <p>{movimiento.numeroCorrelativoComprobante || "-"}</p>
              </div>
            </div>
            <div className="col-12">
              <div className="field">
                <label className="font-bold">Proveedor:</label>
                <p>{movimiento.entidadComercial?.razonSocial || "-"}</p>
              </div>
            </div>
          </div>
        </Panel>
      </div>

      {/* Visor PDF */}
      <div className="col-12">
        <PDFDocumentManager
          moduleName="movimiento-caja-comprobante"
          fieldName="urlDocumentoMovCaja"
          entityId={movimiento?.id}
          title="Comprobante de Gasto (Factura, Boleta, etc.)"
          dialogTitle="Comprobante de Gasto"
          uploadButtonLabel="Subir Comprobante"
          viewButtonLabel="Ver"
          downloadButtonLabel="Descargar"
          emptyMessage="No hay comprobante de gasto cargado"
          emptyDescription="No hay comprobante de gasto disponible para este movimiento"
          control={control}
          errors={{}}
          setValue={setValue}
          watch={watch}
          getValues={getValues}
          defaultValues={{ urlDocumentoMovCaja: urlPdf }}
          readOnly={true}
        />
      </div>
    </div>
  );
}