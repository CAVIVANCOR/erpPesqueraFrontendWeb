/**
 * PdfComprobanteOperacionDetMovOTMantenimientoCard.jsx - WRAPPER para Sistema PDF V2
 *
 * Componente wrapper para comprobantes de operación en OT Mantenimiento.
 * Solo configura y llama al componente genérico PDFDocumentManager.
 *
 * @author ERP Megui
 * @version 2.0.0 - Sistema PDF V2
 */

import React from "react";
import PDFDocumentManager from "../pdf/PDFDocumentManager";

/**
 * Componente PdfComprobanteOperacionDetMovOTMantenimientoCard
 * Wrapper que configura PDFDocumentManager para comprobantes de operación
 * 
 * @param {Object} props - Props del componente
 * @param {number|string} props.detMovimientoId - ID del detalle de movimiento (OBLIGATORIO)
 * @param {Object} props.control - Control de React Hook Form
 * @param {Object} props.errors - Errores de validación
 * @param {Function} props.setValue - Función para setear valores
 * @param {Function} props.watch - Función para observar cambios
 * @param {Function} props.getValues - Función para obtener valores
 * @param {Object} props.defaultValues - Valores por defecto
 * @param {Boolean} props.readOnly - Modo solo lectura
 */
const PdfComprobanteOperacionDetMovOTMantenimientoCard = ({
  detMovimientoId,
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
      moduleName="ot-mantenimiento-operacion"
      fieldName="urlComprobanteOperacionMovCaja"
      entityId={detMovimientoId}
      title="Comprobante de Operación (Voucher, Recibo, etc.)"
      dialogTitle="Subir Comprobante de Operación"
      uploadButtonLabel="Capturar/Subir Comprobante"
      viewButtonLabel="Ver"
      downloadButtonLabel="Descargar"
      emptyMessage="No hay comprobante de operación cargado"
      emptyDescription="Use el botón 'Capturar/Subir Comprobante' para agregar el comprobante de operación (voucher, recibo, etc.). Puede subir múltiples archivos y se consolidarán automáticamente."
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

export default PdfComprobanteOperacionDetMovOTMantenimientoCard;