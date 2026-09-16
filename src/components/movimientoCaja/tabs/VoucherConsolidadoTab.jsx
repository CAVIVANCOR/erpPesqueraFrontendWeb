/**
 * VoucherConsolidadoTab.jsx - Tab para visualizar voucher contable
 *
 * Componente para mostrar el voucher contable (comprobante de diario) de un movimiento de caja.
 * Usa PDFDocumentManager en modo solo lectura.
 *
 * @author ERP Megui
 * @version 2.0.0
 */

import React from "react";
import PDFDocumentManager from "../../pdf/PDFDocumentManager";
import { Message } from "primereact/message";
import { useForm } from "react-hook-form";

export default function VoucherConsolidadoTab({ movimiento, toast }) {
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
          text="No hay voucher contable disponible para este movimiento"
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
          fieldName="urlDocumentoMovCaja"
          entityId={movimiento?.id}
          title="Voucher Contable (Comprobante de Diario)"
          dialogTitle="Voucher Contable"
          uploadButtonLabel="Subir Voucher"
          viewButtonLabel="Ver"
          downloadButtonLabel="Descargar"
          emptyMessage="No hay voucher contable cargado"
          emptyDescription="No hay voucher contable disponible para este movimiento"
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