/**
 * PdfVoucherConsolidadoCard.jsx - WRAPPER para Sistema PDF V2
 *
 * Componente wrapper para voucher consolidado del pago de cuenta por cobrar.
 * Solo configura y llama al componente genérico PDFDocumentManager.
 *
 * @author ERP Megui
 * @version 2.0.0 - Sistema PDF V2
 */

import React from "react";
import PDFDocumentManager from "../pdf/PDFDocumentManager";

/**
 * Componente PdfVoucherConsolidadoCard
 * Wrapper que configura PDFDocumentManager para el voucher consolidado
 *
 * @param {Object} props - Props del componente
 * @param {Number} props.pagoCuentaPorCobrarId - ID del pago
 * @param {Object} props.control - Control de React Hook Form
 * @param {Object} props.errors - Errores de validación
 * @param {Function} props.setValue - Función para setear valores
 * @param {Function} props.watch - Función para observar cambios
 * @param {Function} props.getValues - Función para obtener valores
 * @param {Object} props.defaultValues - Valores por defecto
 * @param {Boolean} props.readOnly - Modo solo lectura
 */
const PdfVoucherConsolidadoCard = ({
  pagoCuentaPorCobrarId,
  control,
  errors,
  setValue,
  watch,
  getValues,
  defaultValues = {},
  readOnly = false,
}) => {
  return (
    <PDFDocumentManager
      moduleName="pago-cxc-voucher-consolidado"
      fieldName="urlVoucherOperacionConsolidado"
      entityId={pagoCuentaPorCobrarId}
      title="📄 Voucher Consolidado del Pago"
      dialogTitle="Voucher Consolidado"
      uploadButtonLabel="Regenerar Voucher"
      viewButtonLabel="Ver Voucher"
      downloadButtonLabel="Descargar"
      emptyMessage="Voucher no generado"
      emptyDescription="El voucher consolidado se genera automáticamente al procesar el pago. Si no existe, puede regenerarlo usando el botón correspondiente."
      control={control}
      errors={errors}
      setValue={setValue}
      watch={watch}
      getValues={getValues}
      defaultValues={defaultValues}
      readOnly={readOnly}
      allowDelete={false}
    />
  );
};

export default PdfVoucherConsolidadoCard;
