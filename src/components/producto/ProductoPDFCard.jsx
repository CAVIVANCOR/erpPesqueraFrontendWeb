/**
 * ProductoPDFCard.jsx - WRAPPER para Sistema PDF V2
 *
 * Componente wrapper para ficha técnica PDF de producto.
 * Solo configura y llama al componente genérico PDFDocumentManager.
 *
 * @author ERP Megui
 * @version 2.0.0 - Sistema PDF V2
 */

import React from "react";
import PDFDocumentManager from "../pdf/PDFDocumentManager";

const ProductoPDFCard = ({
  control,
  errors,
  setValue,
  watch,
  getValues,
  defaultValues = {},
  readOnly = false,
  productoId,
}) => {
  return (
    <PDFDocumentManager
      moduleName="producto"
      fieldName="urlFichaTecnica"
      entityId={productoId}
      title="Ficha Técnica Producto (PDF)"
      dialogTitle="Subir Ficha Técnica"
      uploadButtonLabel="Capturar/Subir Ficha Técnica"
      viewButtonLabel="Ver"
      downloadButtonLabel="Descargar"
      emptyMessage="No hay ficha técnica cargada"
      emptyDescription="Use el botón 'Capturar/Subir Ficha Técnica' para agregar la ficha técnica del producto. Puede subir múltiples archivos y se consolidarán automáticamente."
      control={control}
      errors={errors}
      setValue={setValue}
      watch={watch}
      getValues={getValues}
      defaultValues={defaultValues}
      readOnly={readOnly}
    />
  );
};

export default ProductoPDFCard;