/**
 * PdfDetMovEntregaRendirCard.jsx - WRAPPER para Sistema PDF V2
 *
 * Componente wrapper para comprobantes de movimientos de entrega a rendir.
 * Solo configura y llama al componente genérico PDFDocumentManager.
 *
 * @author ERP Megui
 * @version 2.0.0 - Sistema PDF V2
 */

import React from "react";
import PDFDocumentManager from "../pdf/PDFDocumentManager";

/**
 * Componente PdfDetMovEntregaRendirCard
 * Wrapper que configura PDFDocumentManager para comprobantes de movimientos
 *
 * @param {Object} props - Props del componente
 * @param {Object} props.control - Control de React Hook Form
 * @param {Object} props.errors - Errores de validación
 * @param {Function} props.setValue - Función para setear valores
 * @param {Function} props.watch - Función para observar cambios
 * @param {Function} props.getValues - Función para obtener valores
 * @param {Object} props.defaultValues - Valores por defecto
 * @param {number|string} props.detMovId - ID del detalle movimiento (OBLIGATORIO)
 * @param {Boolean} props.readOnly - Modo solo lectura
 */
const PdfDetMovEntregaRendirCard = ({
  control,
  errors,
  setValue,
  watch,
  getValues,
  defaultValues = {},
  detMovId,
  readOnly = false,
}) => {
  return (
    <PDFDocumentManager
      moduleName="det-movs-entrega-rendir-pesca-industrial-comprobante"
      fieldName="urlComprobanteMovimiento"
      entityId={detMovId}
      title="Comprobante de Movimiento"
      dialogTitle="Subir Comprobante de Movimiento"
      uploadButtonLabel="Capturar/Subir Comprobante"
      viewButtonLabel="Ver"
      downloadButtonLabel="Descargar"
      emptyMessage="No hay comprobante cargado"
      emptyDescription="Use el botón 'Capturar/Subir Comprobante' para agregar el comprobante del movimiento (factura, boleta, recibo). Puede subir múltiples archivos y se consolidarán automáticamente."
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

export default PdfDetMovEntregaRendirCard;
