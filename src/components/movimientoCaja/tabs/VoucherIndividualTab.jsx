/**
 * VoucherIndividualTab.jsx - Tab para visualizar voucher individual
 *
 * Componente para mostrar el voucher individual de un movimiento de caja.
 * Usa PDFDocumentManager en modo solo lectura.
 *
 * @author ERP Megui
 * @version 1.0.0
 */

import React from "react";
import PDFDocumentManager from "../../pdf/PDFDocumentManager";
import { Message } from "primereact/message";
import { useForm } from "react-hook-form";

export default function VoucherIndividualTab({ movimiento, toast }) {
  const { control, setValue, watch, getValues } = useForm({
    defaultValues: {
      urlOperacionIndividualOperacionCaja: movimiento?.urlOperacionIndividualOperacionCaja || ""
    }
  });

  const urlPdf = movimiento?.urlOperacionIndividualOperacionCaja;

  if (!urlPdf) {
    return (
      <div className="flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
        <Message
          severity="info"
          text="No hay voucher individual disponible para este movimiento"
          style={{ width: "100%" }}
        />
      </div>
    );
  }

  return (
    <div className="grid">
      <div className="col-12">
        <PDFDocumentManager
          moduleName="movimiento-caja-voucher-individual"
          fieldName="urlOperacionIndividualOperacionCaja"
          entityId={movimiento?.id}
          title="Voucher Individual del Movimiento"
          dialogTitle="Voucher Individual"
          uploadButtonLabel="Subir Voucher"
          viewButtonLabel="Ver"
          downloadButtonLabel="Descargar"
          emptyMessage="No hay voucher individual cargado"
          emptyDescription="No hay voucher individual disponible para este movimiento"
          control={control}
          errors={{}}
          setValue={setValue}
          watch={watch}
          getValues={getValues}
          defaultValues={{ urlOperacionIndividualOperacionCaja: urlPdf }}
          readOnly={true}
        />
      </div>
    </div>
  );
}