/**
 * DocPrestamoPrincipal.jsx - WRAPPER para Sistema PDF V2
 *
 * Componente wrapper específico para Documento Principal de Préstamo Bancario.
 * Solo configura y llama al componente genérico PDFDocumentManager.
 * Toda la lógica de PDF está en el componente genérico.
 *
 * @author ERP Megui
 * @version 2.0.0 - Sistema PDF V2
 */

import React from "react";
import PDFDocumentManager from "../pdf/PDFDocumentManager";

/**
 * Componente DocPrestamoPrincipal
 * Wrapper que configura PDFDocumentManager para documentos principales de préstamos
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
export default function DocPrestamoPrincipal({
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
      moduleName="tesoreria-prestamos-principal"
      fieldName="urlDocumentoPrincipal"
      entityId={prestamoId}
      title="Documento Principal del Préstamo"
      dialogTitle="Subir Documento Principal"
      uploadButtonLabel="Subir Documento Principal"
      viewButtonLabel="Abrir"
      downloadButtonLabel="Descargar"
      emptyMessage="No hay documento principal cargado"
      emptyDescription="Use el botón 'Subir Documento Principal' para agregar el contrato o documento principal del préstamo. Puede subir múltiples archivos (contrato + anexos) y se consolidarán automáticamente."
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