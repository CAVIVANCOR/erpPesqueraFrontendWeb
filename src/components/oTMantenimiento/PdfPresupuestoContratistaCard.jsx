import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import PDFDocumentManager from "../pdf/PDFDocumentManager";

export default function PdfPresupuestoContratistaCard({
  presupuestoId,
  urlDocumentoContratista = "",
  onChange,
  readOnly = false,
}) {
  const { control, setValue, watch, getValues } = useForm({
    defaultValues: {
      urlDocumentoContratista,
    },
  });

  useEffect(() => {
    setValue("urlDocumentoContratista", urlDocumentoContratista);
  }, [urlDocumentoContratista, setValue]);

  const pdfUrl = watch("urlDocumentoContratista");

  useEffect(() => {
    if (onChange) {
      onChange(pdfUrl || "");
    }
  }, [pdfUrl, onChange]);

  return (
    <PDFDocumentManager
      moduleName="ot-mantenimiento-presupuesto-contratista"
      fieldName="urlDocumentoContratista"
      entityId={presupuestoId}
      title="Presupuesto del Contratista"
      dialogTitle="Subir presupuesto del contratista (PDF)"
      uploadButtonLabel="Subir PDF"
      viewButtonLabel="Ver"
      downloadButtonLabel="Descargar"
      emptyMessage="No hay presupuesto cargado"
      emptyDescription="Use el botón para subir el PDF del presupuesto presentado por el contratista."
      control={control}
      errors={{}}
      setValue={setValue}
      watch={watch}
      getValues={getValues}
      defaultValues={{ urlDocumentoContratista }}
      readOnly={readOnly}
    />
  );
}
