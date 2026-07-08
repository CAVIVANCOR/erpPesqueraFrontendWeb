/**
 * VoucherConsolidadoTab.jsx - Tab para visualizar voucher consolidado
 *
 * Componente para mostrar el voucher consolidado de una operación de caja.
 * Usa PDFDocumentManager en modo solo lectura.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React from "react";
import PDFDocumentManager from "../../pdf/PDFDocumentManager";
import { Message } from "primereact/message";
import { useForm } from "react-hook-form";

export default function VoucherConsolidadoTab({ movimiento, toast }) {
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
          text="No hay voucher consolidado disponible para este movimiento"
          style={{ width: "100%" }}
        />
      </div>
    );
  }

  return (
    <div className="grid">
      <div className="col-12">
        <PDFDocumentManager
          moduleName="movimiento-caja-operacion"
          fieldName="urlComprobanteOperacionMovCaja"
          entityId={movimiento?.id}
          title="Voucher Consolidado de la Operación"
          dialogTitle="Voucher Consolidado"
          uploadButtonLabel="Subir Voucher"
          viewButtonLabel="Ver"
          downloadButtonLabel="Descargar"
          emptyMessage="No hay voucher consolidado cargado"
          emptyDescription="No hay voucher consolidado disponible para esta operación"
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