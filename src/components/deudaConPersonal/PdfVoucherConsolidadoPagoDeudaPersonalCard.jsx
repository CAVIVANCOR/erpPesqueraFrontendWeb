/**
 * PdfVoucherConsolidadoPagoDeudaPersonalCard.jsx - WRAPPER para Sistema PDF V2
 *
 * Voucher consolidado de la operación de pago (todas las deudas pagadas, movimientos y asientos).
 * Se genera y sube automáticamente al pagar desde Caja y Bancos (pago múltiple), por eso aquí
 * solo se puede ver y descargar. Todos los pagos de una misma operación comparten el mismo archivo.
 *
 * @author ERP Megui
 */

import React from "react";
import PDFDocumentManager from "../pdf/PDFDocumentManager";

/**
 * @param {number|string} props.pagoId - ID del PagoDeudaPersonal
 * @param {Object} props.control - Control de React Hook Form
 * @param {Object} props.errors - Errores de validación
 * @param {Function} props.setValue - Función para setear valores
 * @param {Function} props.watch - Función para observar cambios
 * @param {Function} props.getValues - Función para obtener valores
 * @param {Object} props.defaultValues - Valores por defecto
 */
const PdfVoucherConsolidadoPagoDeudaPersonalCard = ({
  pagoId,
  control,
  errors,
  setValue,
  watch,
  getValues,
  defaultValues = {},
}) => {
  return (
    <PDFDocumentManager
      moduleName="pago-deuda-personal-consolidado"
      fieldName="urlVoucherOperacionConsolidado"
      entityId={pagoId}
      title="📄 Voucher Consolidado de la Operación"
      dialogTitle="Voucher Consolidado"
      uploadButtonLabel="Voucher generado automáticamente"
      viewButtonLabel="Ver Voucher"
      downloadButtonLabel="Descargar"
      emptyMessage="Voucher no generado"
      emptyDescription="El voucher consolidado se genera automáticamente al pagar desde Caja y Bancos."
      control={control}
      errors={errors}
      setValue={setValue}
      watch={watch}
      getValues={getValues}
      defaultValues={defaultValues}
      readOnly={true}
    />
  );
};

export default PdfVoucherConsolidadoPagoDeudaPersonalCard;
