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
      urlComprobanteOperacionMovCaja: movimiento?.urlComprobanteOperacionMovCaja || ""
    }
  });

  const urlPdf = movimiento?.urlComprobanteOperacionMovCaja;

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
      {/* Visor PDF */}
      <div className="col-12">
        <PDFDocumentManager
          moduleName="movimiento-caja-comprobante"
          fieldName="urlComprobanteOperacionMovCaja"
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
          defaultValues={{ urlComprobanteOperacionMovCaja: urlPdf }}
          readOnly={true}
        />
      </div>
    </div>
  );
}