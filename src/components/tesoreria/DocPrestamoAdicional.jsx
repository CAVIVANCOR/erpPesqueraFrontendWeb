/**
 * DocPrestamoAdicional.jsx - WRAPPER para Sistema PDF V2
 *
 * Componente wrapper específico para Documento Adicional de Préstamo Bancario.
 * Solo configura y llama al componente genérico PDFDocumentManager.
 * Toda la lógica de PDF está en el componente genérico.
 *
 * @author ERP Megui
 * @version 2.0.0 - Sistema PDF V2
 */

import React from "react";
import PDFDocumentManager from "../pdf/PDFDocumentManager";

/**
 * Componente DocPrestamoAdicional
 * Wrapper que configura PDFDocumentManager para documentos adicionales de préstamos
 * 
 * @param {Object} props - Props del componente
 * @param {number|string} props.prestamoId - ID del préstamo (OBLIGATORIO)
 * @param {Object} props.control - Control de React Hook Form
 * @param {Object} props.errors - Errores de validación
 * @param {Function} props.setValue - Función para setear valores
 * @param {Function} props.watch - Función para observar cambios
 * @param {Function} props.getValues - Función para obtener valores
 * @param {Object} props.defaultValues - Valores por defecto
 * @param {Boolean} props.readOnly - Modo solo lectura
 */
export default function DocPrestamoAdicional({
  prestamoId,
  control,
  errors,
  setValue,
  watch,
  getValues,
  defaultValues = {},
  readOnly = false,
}) {
  return (
    <PDFDocumentManager
      moduleName="tesoreria-prestamos-adicional"
      fieldName="urlDocumentoAdicional"
      entityId={prestamoId}
      title="Documento Adicional del Préstamo"
      dialogTitle="Subir Documento Adicional"
      uploadButtonLabel="Subir Documento Adicional"
      viewButtonLabel="Abrir"
      downloadButtonLabel="Descargar"
      emptyMessage="No hay documento adicional cargado"
      emptyDescription="Use el botón 'Subir Documento Adicional' para agregar documentos complementarios como garantías, avales, o anexos adicionales. Puede subir múltiples archivos y se consolidarán automáticamente."
      control={control}
      errors={errors}
      setValue={setValue}
      watch={watch}
      getValues={getValues}
      defaultValues={defaultValues}
      readOnly={readOnly}
    />
  );
}