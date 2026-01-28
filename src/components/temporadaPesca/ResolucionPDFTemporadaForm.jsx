/**
 * ResolucionPDFTemporadaForm.jsx - WRAPPER para Sistema PDF V2
 *
 * Componente wrapper específico para Resolución Ministerial de Temporada Pesca.
 * Solo configura y llama al componente genérico PDFDocumentManager.
 * Toda la lógica de PDF está en el componente genérico.
 *
 * @author ERP Megui
 * @version 2.0.0 - Sistema PDF V2
 */

import React from "react";
import PDFDocumentManager from "../pdf/PDFDocumentManager";

/**
 * Componente ResolucionPDFTemporadaForm
 * Wrapper que configura PDFDocumentManager para resoluciones ministeriales
 * 
 * @param {Object} props - Props del componente
 * @param {Object} props.control - Control de React Hook Form
 * @param {Object} props.errors - Errores de validación
 * @param {Function} props.setValue - Función para setear valores
 * @param {Function} props.watch - Función para observar cambios
 * @param {Function} props.getValues - Función para obtener valores
 * @param {Object} props.defaultValues - Valores por defecto
 * @param {number|string} props.temporadaPescaId - ID de la temporada de pesca (OBLIGATORIO)
 */
export default function ResolucionPDFTemporadaForm({
  control,
  errors,
  setValue,
  watch,
  getValues,
  defaultValues = {},
  temporadaPescaId,
  readOnly = false,
}) {
  return (
    <PDFDocumentManager
      moduleName="temporada-pesca"
      fieldName="urlResolucionPdf"
      entityId={temporadaPescaId}
      title="Resolución Ministerial (PDF)"
      dialogTitle="Subir Resolución Ministerial"
      uploadButtonLabel="Subir Resolución PDF"
      viewButtonLabel="Abrir"
      downloadButtonLabel="Descargar"
      emptyMessage="No hay resolución cargada"
      emptyDescription="Use el botón 'Subir Resolución PDF' para agregar documentos. Puede subir múltiples archivos (resolución + anexos) y se consolidarán automáticamente."
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